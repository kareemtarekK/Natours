class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1) filter & complex filter
    const queryObj = { ...this.queryString };
    const excluted = ['sort', 'fields', 'page', 'limit'];
    excluted.forEach((e) => delete queryObj[e]);
    let FilterObj = JSON.stringify(queryObj);
    FilterObj = FilterObj.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );
    this.query = this.query.find(JSON.parse(FilterObj));
    return this;
  }

  sort() {
    // 2) sort
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // // 3) fields
    if (this.queryString.fields) {
      console.log(this.queryString.fields);
      const selectedBy = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(selectedBy);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // // 4) pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
