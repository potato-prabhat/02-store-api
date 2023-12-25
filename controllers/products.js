const Product = require('../models/product');
const getAllProductsStatic = async (req, res) => {
  //   throw new Error('testing async error');
  const products = await Product.find({
    price: { $gt: 40 },
    rating: { $gte: 4 },
  }).sort('-name price');
  res.status(200).json({ msg: products, nbHits: products.length });
};

const getAllProducts = async (req, res) => {
  const { name, sort, fields, numericFilters } = req.query;
  const numericFiltersSeparated = {};
  const queryObject = { ...req.query };
  if (name) {
    queryObject.name = { $regex: name, $options: 'i' };
  }
  if (sort) {
    queryObject.sort = sort.split(',').join(' ');
  }
  if (fields) {
    queryObject.fields = fields.split(',').join(' ');
  }
  if (numericFilters) {
    const operatorMap = {
      '>': '$gt',
      '>=': '$gte',
      '<': '$lt',
      '<=': '$lte',
      '=': '$eq',
    };
    const regex = /\b(<|>|>=|<=|=)\b/g;
    let filters = numericFilters.replace(
      regex,
      (match) => `-${operatorMap[match]}-`
    );
    console.log(filters);
    const options = ['price', 'rating'];
    filters = filters.split(',').forEach((item) => {
      const [field, operator, value] = item.split('-');
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number([value]) };
      }
    });
  }
  delete queryObject.numericFilters;
  console.log(queryObject);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find(queryObject)
    .sort(`${sort ? queryObject.sort : 'createdAt'}`)
    .select(
      `${
        queryObject.fields
          ? queryObject.fields
          : 'name price featured rating createdAt company'
      }`
    )
    .limit(limit)
    .skip(skip);
  res.status(200).json({
    msg: products,
    nbHits: `${products.length ? products.length : 0}`,
  });
};

module.exports = {
  getAllProducts,
  getAllProductsStatic,
};
