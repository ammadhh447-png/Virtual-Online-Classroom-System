import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

const QuizzesPage = () => {
    const { user } = useContext(AuthContext);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/quizzes`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setQuizzes(res.data);
        } catch (error) {
            toast.error("Failed to fetch quizzes.");
        } finally {
            setLoading(false);
        }
    };

    const deleteQuiz = async (id) => {
        if (window.confirm("Are you sure you want to delete this quiz?")) {
            try {
                await axios.delete(`${API}/api/quizzes/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                toast.success("Quiz deleted successfully.");
                fetchQuizzes();
            } catch (error) {
                toast.error("Failed to delete quiz.");
            }
        }
    };

    return (
        <div className="p-6 text-white min-h-screen">
            <div className="flex items-center justify-between gap-3 mb-6">
                <h1 className="text-3xl font-bold">Manage Quizzes</h1>
                <Link
                    to="/dashboard/createquiz"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
                >
                    <PlusCircle className="w-4 h-4" /> Create Quiz
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <p className="text-cyan-400 text-lg animate-pulse">Loading quizzes...</p>
                </div>
            ) : quizzes.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-900/70 text-gray-300 border-b border-gray-700 uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Title</th>
                                <th className="px-6 py-4 font-semibold">Time Limit</th>
                                <th className="px-6 py-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {quizzes.map((quiz) => (
                                <tr key={quiz._id} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium">{quiz.title}</td>
                                    <td className="px-6 py-4">{quiz.timeLimit} minutes</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4">
                                            <Link to={`/dashboard/checkquizes?quizId=${quiz._id}`} className="text-cyan-400 hover:text-cyan-300">View Submissions</Link>
                                            <button onClick={() => deleteQuiz(quiz._id)} className="text-red-500 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10 bg-gray-900/40 rounded-lg border border-gray-800">
                    <p className="text-gray-400">No quizzes found. Create one to get started.</p>
                </div>
            )}
        </div>
    );
};

export default QuizzesPage;