import {
  ADD_INVALID_WARRANTY,
  ADD_WARRANTY,
  EDIT_WARRANTY,
  FIXED_INVALID_WARRANTY,
  REMOVE_WARRANTY,
  REMOVE_INVALID_WARRANTY,
  SUBMIT_CHECKLIST,
  UPLOAD_CSV,
  SET_PRODUCT_TYPE
} from "./actions";

const initialState = {
  warrantiesById: {},
  warranties: [],
  checklist: {},
  invalidWarranties: [],
  productType: "WAV"
};

export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_WARRANTY: {
      const warranties = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      const byIds = warranties.reduce((by, w) => {
        by[w.uuid] = w;
        return by;
      }, {});

      return {
        ...state,
        warrantiesById: {
          ...state.warrantiesById,
          ...byIds
        },
        warranties: [...state.warranties, ...Object.values(byIds)]
      };
    }

    case ADD_INVALID_WARRANTY: {
      const warranties = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      return {
        ...state,
        invalidWarranties: [...state.invalidWarranties, ...warranties]
      };
    }

    case REMOVE_INVALID_WARRANTY: {
      const uuidToRemove = action.payload;

      return {
        ...state,
        invalidWarranties: state.invalidWarranties.filter(
          (w) => w.uuid !== uuidToRemove
        )
      };
    }

    case EDIT_WARRANTY: {
      let { uuid, vin, record } = action.payload;

      return {
        ...state,
        warrantiesById: {
          ...state.warrantiesById,
          [uuid]: {
            ...state.warrantiesById[uuid],
            record: { ...state.warrantiesById[uuid].record, ...record },
            vin
          }
        }
      };
    }

    case REMOVE_WARRANTY: {
      const uuid = action.payload;
      const newByIds = { ...state.warrantiesById };
      delete newByIds[uuid];

      return {
        ...state,
        warrantiesById: newByIds,
        warranties: Object.values(newByIds)
      };
    }

    case SUBMIT_CHECKLIST:
      return {
        ...state,
        checklist: action.payload
      };

    case SET_PRODUCT_TYPE:
      return {
        ...state,
        productType: action.payload
      };

    default:
    case FIXED_INVALID_WARRANTY:
      return state;
  }
};
