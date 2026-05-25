import api from "./api.js";

export const getUbigeos = (params = {}) => api.get("/ubigeo", { params });
export const getUbigeoByCode = (code) => api.get(`/ubigeo/${code}`);
