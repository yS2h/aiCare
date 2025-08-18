/**
 * @param {import('express').Request} req
 * @param {{ id:string, name?:string, avatarUrl?:string, email?:string }} user
 */
function setLoginSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);

      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        email: user.email,
      };

      req.session.save((err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });
}

module.exports = { setLoginSession };
