module.exports = async (num) => {
  const {double} = await import('./dynamic-import');

  return double(num);
};
