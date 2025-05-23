import { z } from 'zod';
import { validateInput, auditToolInvocation, checkRateLimit } from './security.js';

/**
 * Wrap a tool handler with security features
 */
export function createSecureTool(server, toolName, description, schema, handler) {
  // Create Zod schema from the input schema if it's not already
  const zodSchema = schema.type ? z.object(
    Object.entries(schema.properties || {}).reduce((acc, [key, prop]) => {
      let fieldSchema;
      
      switch (prop.type) {
        case 'string':
          fieldSchema = z.string();
          if (prop.minLength) fieldSchema = fieldSchema.min(prop.minLength);
          if (prop.maxLength) fieldSchema = fieldSchema.max(prop.maxLength);
          break;
        case 'number':
          fieldSchema = z.number();
          if (prop.minimum !== undefined) fieldSchema = fieldSchema.min(prop.minimum);
          if (prop.maximum !== undefined) fieldSchema = fieldSchema.max(prop.maximum);
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'array':
          fieldSchema = z.array(z.any());
          break;
        case 'object':
          fieldSchema = z.object({}).passthrough();
          break;
        default:
          fieldSchema = z.any();
      }
      
      // Make optional if not required
      if (!schema.required || !schema.required.includes(key)) {
        fieldSchema = fieldSchema.optional();
      }
      
      acc[key] = fieldSchema;
      return acc;
    }, {})
  ) : z.any();

  // Register the tool with security wrapper
  server.tool(toolName, description, schema, async (args, extra) => {
    const startTime = Date.now();
    let result = null;
    let error = null;
    
    try {
      // Rate limiting
      const userId = extra?.context?.userId || 'anonymous';
      if (!checkRateLimit(`tool:${toolName}:${userId}`)) {
        throw new Error('Rate limit exceeded');
      }
      
      // Validate input
      const validation = validateInput(zodSchema, args);
      if (!validation.success) {
        throw new Error(`Invalid input: ${validation.error}`);
      }
      
      // Execute the handler
      result = await handler(validation.data, extra);
      
      // Audit successful invocation
      auditToolInvocation(
        toolName,
        args,
        userId,
        result,
        null
      );
      
      return result;
    } catch (err) {
      error = err;
      
      // Audit failed invocation
      auditToolInvocation(
        toolName,
        args,
        extra?.context?.userId || 'anonymous',
        null,
        error
      );
      
      // Re-throw the error
      throw error;
    } finally {
      // Log performance metrics
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`Tool ${toolName} took ${duration}ms to execute`);
      }
    }
  });
}

/**
 * Wrap resource handler with security features
 */
export function createSecureResource(server, name, uri, handler) {
  server.resource(name, uri, async (resourceUri, extra) => {
    let error = null;
    
    try {
      // Rate limiting
      const userId = extra?.context?.userId || 'anonymous';
      if (!checkRateLimit(`resource:${name}:${userId}`, 50, 60000)) {
        throw new Error('Rate limit exceeded');
      }
      
      // Execute the handler
      const result = await handler(resourceUri, extra);
      
      // Audit successful access
      auditResourceAccess(
        resourceUri.href,
        userId,
        true,
        null
      );
      
      return result;
    } catch (err) {
      error = err;
      
      // Audit failed access
      auditResourceAccess(
        resourceUri.href,
        extra?.context?.userId || 'anonymous',
        false,
        error
      );
      
      // Re-throw the error
      throw error;
    }
  });
}