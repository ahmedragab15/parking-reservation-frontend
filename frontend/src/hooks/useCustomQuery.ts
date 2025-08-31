import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/config/axios.config";
import { AxiosRequestConfig } from "axios";

interface ICustomQuery {
  queryKey: string[];
  url: string;
  config?: AxiosRequestConfig;
}

const useCustomQuery = ({ queryKey, url, config }: ICustomQuery) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await axiosInstance.get(url, config);
      return data;
    },
  });
};

export default useCustomQuery;
