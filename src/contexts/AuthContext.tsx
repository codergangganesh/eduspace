import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "student" | "lecturer";
  studentId?: string;
  program?: string;
  year?: string;
  phone?: string;
  dateOfBirth?: string;
  bio?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  avatar?: string;
  verified?: boolean;
  badges?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: "student" | "lecturer") => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample credentials for testing
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "student@university.edu": {
    password: "student123",
    user: {
      id: "1",
      email: "student@university.edu",
      fullName: "Alex Johnson",
      role: "student",
      studentId: "482910",
      program: "B.Sc. Computer Science",
      year: "3rd Year",
      phone: "+1 (555) 123-4567",
      dateOfBirth: "1999-05-15",
      bio: "Computer Science major with a passion for AI and Machine Learning. Currently working on a thesis project related to neural networks.",
      address: {
        street: "123 University Ave, Apt 4B",
        city: "Cambridge",
        state: "MA",
        zipCode: "02138",
        country: "United States",
      },
      verified: true,
      badges: ["Student", "Dean's List"],
    },
  },
  "lecturer@university.edu": {
    password: "lecturer123",
    user: {
      id: "2",
      email: "lecturer@university.edu",
      fullName: "Dr. Sarah Williams",
      role: "lecturer",
      phone: "+1 (555) 987-6543",
      bio: "Professor of Computer Science with 15 years of experience in software engineering and data science.",
      address: {
        street: "456 Faculty Lane",
        city: "Cambridge",
        state: "MA",
        zipCode: "02139",
        country: "United States",
      },
      verified: true,
      badges: ["Faculty", "Department Head"],
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("eduspace_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string, role: "student" | "lecturer") => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS[email.toLowerCase()];
    
    if (!mockUser) {
      return { success: false, error: "User not found. Try student@university.edu or lecturer@university.edu" };
    }
    
    if (mockUser.password !== password) {
      return { success: false, error: "Invalid password. Use student123 or lecturer123" };
    }
    
    if (mockUser.user.role !== role) {
      return { success: false, error: `This account is registered as a ${mockUser.user.role}, not a ${role}` };
    }

    setUser(mockUser.user);
    localStorage.setItem("eduspace_user", JSON.stringify(mockUser.user));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("eduspace_user");
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("eduspace_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
