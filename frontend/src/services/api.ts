import axiosInstance from "../config/axios.config";
import Cookies from "js-cookie";

export async function login(username: string, password: string) {
    const res = await axiosInstance.post("/auth/login", { username, password });
    const { token, user } = res.data;
    Cookies.set("token", token, { expires: 7 });
    Cookies.set("user", JSON.stringify(user), { expires: 7 });
    return { token, user };
}

export async function logout() {
    Cookies.remove("token");
    window.location.href = "/login";
    return { token: null, user: null };
}

export const getZonesByGate = async (gateId: string): Promise<Zone[]> => {
    const response = await axiosInstance.get(`/master/zones?gateId=${gateId}`);
    return response.data;
};

export const getSubscription = async (id: string): Promise<Subscription> => {
    const response = await axiosInstance.get(`/subscriptions/${id}`);
    return response.data;
};

export const postCheckin = async (data: CheckinRequest): Promise<CheckinResponse> => {
    const response = await axiosInstance.post("/tickets/checkin", data);
    return response.data;
};