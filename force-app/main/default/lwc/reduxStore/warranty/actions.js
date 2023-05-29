import { uuidv4 } from "c/utils";

export const ADD_WARRANTY = "WARRANTY/ADD";
export const ADD_INVALID_WARRANTY = "WARRANTY/ADD_INVALID_WARRANTY";
export const FIXED_INVALID_WARRANTY = "WARRANTY/FIXED_INVALID_WARRANTY";
export const REMOVE_INVALID_WARRANTY = "WARRANTY/FIXED_INVALID_WARRANTY";
export const EDIT_WARRANTY = "WARRANTY/EDIT";
export const REMOVE_WARRANTY = "WARRANTY/REMOVE";
export const UPLOAD_CSV = "WARRANTY/UPLOAD_CSV";
export const SUBMIT_CHECKLIST = "WARRANTY/SUBMIT_CHECKLIST";
export const SET_PRODUCT_TYPE = "WARRANTY/SET_PRODUCT_TYPE";

export const addWarranty = (maybeWarranties) => (dispatch) => {
  const warranties = (Array.isArray(maybeWarranties)
      ? maybeWarranties
      : [maybeWarranties]
  ).map((w) => {
    const record = {
      ...w.record,
      Name: w.vin || w.uuid
    };
    return {
      ...w,
      uuid: w.uuid || uuidv4(), // warranties from csv would have that generated already
      record: record
    };
  });

  dispatch({
    type: ADD_WARRANTY,
    payload: warranties
  });
};

export const addInvalidWarranty = (warranty) => (dispatch) => {
  dispatch({
    type: ADD_INVALID_WARRANTY,
    payload: warranty
  });
};

export const editWarranty = (warranty) => (dispatch) => {
  dispatch({
    type: EDIT_WARRANTY,
    payload: warranty
  });
};

export const fixedInvalidWarranty = (warranty) => (dispatch) => {
  dispatch({
    type: REMOVE_INVALID_WARRANTY,
    payload: warranty.uuid
  });
  dispatch({
    type: ADD_WARRANTY,
    payload: warranty
  });
};

export const removeInvalidWarranty = uuid => dispatch => {
  dispatch({
    type: REMOVE_INVALID_WARRANTY,
    payload: uuid
  });
};

export const removeWarranty = (uuid) => (dispatch) => {
  dispatch({
    type: REMOVE_WARRANTY,
    payload: uuid
  });
};

export const submitChecklist = (checklist) => (dispatch) => {
  dispatch({
    type: SUBMIT_CHECKLIST,
    payload: checklist
  });
};

export const setProductType = (type) => (dispatch) => {
  dispatch({
    type: SET_PRODUCT_TYPE,
    payload: type
  })
}
