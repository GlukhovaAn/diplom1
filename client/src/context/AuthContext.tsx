import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "../utils/axios";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  token?: string;
  isAdmin?: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
    address: string
  ) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateUserAvatar: (avatarUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("/auth/login", { email, password });

      const userData = response.data;

      if (userData.email === "admin@gmail.com" || userData.role === "admin") {
        userData.isAdmin = true;
      }

      if (!userData.avatar) {
        userData.avatar = null;
      }

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${userData.token}`

      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    address: string
  ) => {
    try {
      const response = await axios.post("/auth/register", {
        name,
        email,
        password,
        phone,
        address,
      });

      const userData = response.data;

      if (userData.email === "admin@gmail.com" || userData.role === "admin") {
        userData.isAdmin = true;
      }

      if (!userData.avatar) {
        userData.avatar = null;
      }

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${userData.token}`;

      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    delete axios.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };

  const updateUserAvatar = (avatarUrl: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        setUser,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
