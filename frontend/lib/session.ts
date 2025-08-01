import { getServerSession } from "next-auth";
import authOptions from "./auth";

export const getServerAuthSession = async () => {
    return await getServerSession(authOptions);
};
