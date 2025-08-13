const { registry } = require("../docs/openapi");

/**
 * defineRoute(router, {
 *   method: 'get'|'post'|'put'|'delete'|'patch',
 *   path: '/api/...',
 *   summary: '요약',
 *   request: { body?: zodSchema },   // (선택) 요청 바디 Zod 스키마
 *   responses: {                     // (선택) 응답 스키마들
 *     200: { description: '성공', body?: zodSchema },
 *     400: { description: '실패', body?: zodSchema },
 *   },
 *   handler: async ({ body }, req, res) => any
 * })
 */

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
