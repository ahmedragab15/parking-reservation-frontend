"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { restoreUser } from "@/store/auth_slice/authSlice";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = Cookies.get("token");
    const user = Cookies.get("user");
    if (token && user) {
      dispatch(restoreUser({ user: JSON.parse(user), token }));
    }
  }, [dispatch]);

  return <>{children}</>;
}
