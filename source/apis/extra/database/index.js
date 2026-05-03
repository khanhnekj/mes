const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs-extra');
const get = require('lodash/get');
const set = require('lodash/set');
const dbDirectory = `${process.cwd()}/func/db/sqlite`;

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: `${dbDirectory}/fca_database.sqlite`,
	logging: false,
});
const JsonData = sequelize.define('JsonData', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    json: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}',
    },
}, {
    timestamps: true,
});
sequelize.sync({ force: false });
async function Lset(key, value) {
    if (!key) throw new TypeError("No key specified.");
    await arbitrate("set", {
        stringify: false,
        id: key,
        data: value,
        ops: {},
    });
}
async function Lget(key) {
    if (!key) throw new TypeError("No key specified.");
    return await arbitrate("fetch", { id: key, ops: {} });
}
async function Lhas(key) {
    if (!key) throw new TypeError("No key specified.");
    return await arbitrate("has", { id: key, ops: {} });
}
async function Lremove(key) {
    if (!key) throw new TypeError("No key specified.");
    return await arbitrate("delete", { id: key, ops: {} });
}
async function LremoveMultiple(keys) {
    if (!keys) throw new TypeError("No keys specified.");
    try {
        for (let key of keys) {
            await arbitrate("delete", { id: key, ops: {} });
        }
        return true;
    } catch (err) {
        return false;
    }
}
async function Llist() {
    return await arbitrate("all", { ops: {} });
}
const methods = {
    async fetch(params) {
        const record = await JsonData.findByPk(params.id);
        if (!record) return null;
        try {
            return JSON.parse(record.json);
        } catch {
            return record.json;
        }
    },
    async set(params) {
        let record = await JsonData.findByPk(params.id);
        if (!record) {
            record = await JsonData.create({ id: params.id, json: '{}' });
        }
        let fetched;
        try {
            fetched = JSON.parse(record.json);
        } catch {
            fetched = record.json;
        }
        if (typeof fetched === 'object' && params.ops.target) {
            params.data = JSON.parse(params.data);
            params.data = set(fetched, params.ops.target, params.data);
        } else if (params.ops.target) throw new TypeError('Cannot target a non-object.');
        record.json = JSON.stringify(params.data);
        await record.save();
        return JSON.parse(record.json);
    },
    async delete(params) {
        const fetched = await JsonData.findByPk(params.id);
        if (!fetched) return false;
        await fetched.destroy();
        return true;
    },
    async has(params) {
        const fetched = await JsonData.findByPk(params.id);
        return !!fetched;
    },
    async all() {
        const records = await JsonData.findAll();
        return records.map(record => ({
            ID: record.id,
            data: JSON.parse(record.json),
        }));
    },
    async clear() {
        await JsonData.destroy({ where: {}, truncate: true });
        return true;
    },
};
async function arbitrate(method, params) {
    return await methods[method](params);
}
module.exports = function ChernobyL() {
    return {
        set: Lset,
        get: Lget,
        has: Lhas,
        delete: Lremove,
        deleteMultiple: LremoveMultiple,
        list: Llist,
    };
};