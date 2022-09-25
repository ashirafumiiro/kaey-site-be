const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


var opts = {
    toJSON: {
        virtuals: true,
        transform: (doc, ret, options) => {
            delete ret.__v;
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.password
        },
    },
    toObject: { virtuals: true },
    versionKey: false,
};

const UserSchema = new mongoose.Schema({
    name: String,
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    enabled: {type: Boolean, default: false}
}, opts);

UserSchema.virtual('id').get(function () {
    return '' + this._id;
});

UserSchema.methods.correctPassword = function (candidatePassword, userPassword) {
    return bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});


module.exports = mongoose.model('User', UserSchema);