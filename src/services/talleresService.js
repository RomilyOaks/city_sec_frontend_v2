import api from "./api.js";

export const getTalleres = (params = {}) =>
  api.get("/talleres", { params });

export const getTallerById = (id) =>
  api.get(`/talleres/${id}`);

export const createTaller = (data) =>
  api.post("/talleres", data);

export const updateTaller = (id, data) =>
  api.put(`/talleres/${id}`, data);

export const deleteTaller = (id) =>
  api.delete(`/talleres/${id}`);
