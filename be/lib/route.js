const { registry } = require("../docs/openapi");

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
  const requestBody = request.body
    ? { content: { "application/json": { schema: request.body } } }
    : undefined;

  const openapiResponses = {};
  const keys = Object.keys(responses);
  if (keys.length === 0) {
    openapiResponses[200] = { description: "OK" };
  } else {
    for (const code of keys) {
      const def = responses[code] || {};
      openapiResponses[code] = def.body
        ? {
            description: def.description || "",
            content: { "application/json": { schema: def.body } },
          }
        : { description: def.description || "" };
    }
  }

  registry.registerPath({
    method,
    path: docPath || path,
    summary,
    tags,
    security,
    request: requestBody ? { body: requestBody } : undefined,
    responses: openapiResponses,
  });

  router[method](path, async (req, res, next) => {
    try {
      const parsed = {
        body: request.body ? request.body.parse(req.body) : undefined,
        query: request.query
          ? req.query
            ? request.query.parse(req.query)
            : {}
          : req.query,
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
