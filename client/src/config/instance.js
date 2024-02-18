import axios from "axios";

const instance = axios.create({
    withCredentials: true,
    baseURL: "https://ihadnan.xyz"
})
export default instance