/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/config/axios.config";
import { AxiosRequestConfig } from "axios";

interface ICustomMutation {
  url: string;
  method?: "POST" | "PUT" | "DELETE" | "PATCH";
  config?: AxiosRequestConfig;
}

const useCustomMutation = ({ url, method = "POST", config }: ICustomMutation) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance({
        url,
        method,
        data,
        ...config,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
};

export default useCustomMutation;
