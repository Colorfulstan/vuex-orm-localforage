import localforage from 'localforage';
import _ from 'lodash';
import Context from '../common/context';

export default class Action {
  /**
   * Transform Model to include ModelConfig
   * @param {object} model
   */
  static transformModel(model) {
    const context = Context.getInstance();

    /**
     * Add user common fields
     */
    model.getFields = () => {
      if (!model.cachedFields) {
        const _commonFields = context.options.commonFields;
        const commonFields = {};

        if (_commonFields) {
          Object.keys(_commonFields).forEach((fieldName) => {
            const fieldOptions = _commonFields[fieldName];
            let type = 'attr';
            let defaultValue = null;

            if (typeof fieldOptions === 'string') {
              defaultValue = fieldOptions;
            } else {
              type = fieldOptions.type || type;
              defaultValue = fieldOptions.default;
            }

            commonFields[fieldName] = model[type](defaultValue);
          });
        }

        model.cachedFields = _.merge({}, commonFields, model.fields());
      }

      return model.cachedFields;
    };

    const oldIdFn = model.id;

    model.id = (record) => {
      const keys = Array.isArray(model.primaryKey) ? model.primaryKey : [model.primaryKey];

      keys.forEach((key) => {
        if (!record[key]) {
          record[key] = context.options.generateId();
        }
      });

      return oldIdFn.call(model, record);
    };

    model.$localStore = localforage.createInstance({
      name: Context.getInstance().options.name,
      storeName: model.entity,
    });

    return model;
  }

  static getRecordKey(record) {
    return typeof record.$id === 'string' ? record.$id : String(record.$id);
  }
}