module.exports = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  res.redirect('/login');
};
