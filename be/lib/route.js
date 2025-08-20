const { registry } = require("../docs/openapi");

function isZodSchema(x) {
  return x && typeof x.safeParse === "function";
}

function parseOrThrow(schema, value) {
  if (!schema || !isZodSchema(schema)) return value;
  const r = schema.safeParse(value);
  if (r.success) return r.data;
  const err = new Error("ValidationError");
  err.issues = r.error.flatten();
  throw err;
}

function defineRoute(
  router,
  {
    method,
    path,
    docPath,
    summary,
    tags = [],
    security = [],
    request = {},
    responses = {},
    handler,
  }
) {
  let requestBody;
  if (request.body) {
    if (!isZodSchema(request.body) && request.body.content) {
      requestBody = {
        required: request.body.required ?? true,
        description: request.body.description,
        content: request.body.content,
      };
    } else {
      requestBody = {
        required: true,
        content: { "application/json": { schema: request.body } },
      };
    }
  }

  const openapiResponses = {};
  const keys = Object.keys(responses);
  if (keys.length === 0) {
    openapiResponses[200] = { description: "OK" };
  } else {
    for (const code of keys) {
      const def = responses[code] || {};
      if (def.content) {
        openapiResponses[code] = {
          description: def.description || "",
          content: def.content,
        };
      } else if (def.body) {
        openapiResponses[code] = {
          description: def.description || "",
          content: { "application/json": { schema: def.body } },
        };
      } else {
        openapiResponses[code] = { description: def.description || "" };
      }
    }
  }

  const requestObject = {};
  if (request.params) requestObject.params = request.params;
  if (request.query) requestObject.query = request.query;
  if (request.headers) requestObject.headers = request.headers;
  if (requestBody) requestObject.body = requestBody;

  registry.registerPath({
    method,
    path: docPath || path,
    summary,
    tags,
    security,
    request: Object.keys(requestObject).length ? requestObject : undefined,
    responses: openapiResponses,
  });

  router[method](path, async (req, res, next) => {
    try {
      const parsed = {
        params: parseOrThrow(request.params, req.params),
        query: parseOrThrow(request.query, req.query),
        headers: parseOrThrow(request.headers, req.headers),
        body: (() => {
          if (!request.body) return undefined;
          if (!isZodSchema(request.body) && request.body.content) {
            const content = request.body.content;
            const mt = content["application/json"] || Object.values(content)[0];
            const schema = mt && mt.schema;
            return parseOrThrow(schema, req.body);
          }

          return parseOrThrow(request.body, req.body);
        })(),
      };

      const out = await handler(parsed, req, res);
      if (out !== undefined && !res.headersSent) res.json(out);
    } catch (err) {
      if (err?.issues)
        return res
          .status(400)
          .json({ message: "ValidationError", issues: err.issues });
      next(err);
    }
  });
}

module.exports = { defineRoute };
