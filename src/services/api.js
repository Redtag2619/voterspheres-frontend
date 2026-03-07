import axios from "axios"

const API = axios.create({
  baseURL: "https://voterspheres-backend-2pap.onrender.com",
})

export const getCandidates = (page = 1, limit = 10) =>
  API.get(`/candidates?page=${page}&limit=${limit}`)

export const getStates = () =>
  API.get(`/dropdowns/states`)

export const getElectionForecast = () =>
  API.get(`/intelligence/election-forecast`)

export const getDonorNetwork = () =>
  API.get(`/network/influence`)

export const getWarRoomAlerts = () =>
  API.get(`/ai/war-room`)
