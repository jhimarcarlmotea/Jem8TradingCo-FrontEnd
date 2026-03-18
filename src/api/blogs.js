import api from "./axios";

export const getBlogs = async () => {
  try {
    const { data } = await api.get("/blogs");
    return data?.data ?? data?.posts ?? data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getBlogs,
};
