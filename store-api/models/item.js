const mongoose = require('mongoose');

var opts = {
    toJSON: {
        virtuals: true,
        transform: (doc, ret, options) => {
            delete ret.__v;
            ret.id = ret._id.toString();
            delete ret._id;
        },
    },
    toObject: { virtuals: true },
    versionKey: false,
};

const ItemSchema = new mongoose.Schema({
    label: {type: String, required: true},
    description: { type: String, default: 'N/A'  },
    amount: { type: String, default: 'N/A'},
    category: { type: String, required: true },
    image: {type: String, required: true}
}, opts);

module.exports = mongoose.model('Item', ItemSchema);