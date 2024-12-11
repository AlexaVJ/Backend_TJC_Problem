import path from "path";
import { Submission } from "../database/entity/Submission";
import { SubmissionRepository } from "../repositories/SubmissionRepository";
import { Response } from "express";
import { ROOT_DIR } from "../config";
import fs from "fs";

interface SubmissionView {
    id: string;
    veredict: string;
    executionDate: Date;
    problemId: number;
    problemName: string;
    code_base64: string | undefined;
};

export const findSubmission = async (submission_id: string, res: Response) => {
    try {
        const submission: unknown = await SubmissionRepository.findOne({ where: { id: submission_id }, relations: { problem: true, user: true } });
        if (!(submission instanceof Submission)) {
            return res.status(400).send({ message: "The submission doesn't exist" });
        }
        
        const submissionsDir = path.join(`${ROOT_DIR}/submissions`, `user_${submission.user.id}`, `problem_${submission.problem.id}`);
        if (!fs.existsSync(submissionsDir)) {
            return res.status(400).json({ message: "The source code for the submission " + submission.id + " don't exist" });
        }
        const sourceCode = fs.readFileSync(path.join(submissionsDir, `${submission_id}.cpp`));
        const submissionView: SubmissionView = {
            id: submission.id,
            veredict: submission.veredict,
            executionDate: submission.time_judge,
            problemId: submission.problem.id,
            problemName: submission.problem.name,
            code_base64: sourceCode.toString('base64')
        };
        return res.status(200).json(submissionView);
    }
    catch (error: unknown) {
        if (error instanceof Error) {
            return res.status(400).send({ message: error.message });
        }
        else {
            return res.status(400).send({ message: "Something went wrong" });
        }
    }
};

export const findAllSubmissions = async (user_id: number, res: Response) => {
    try {
        const submissions: Submission[] = await SubmissionRepository.find({
            where: {
                user: { id: user_id },
            },
            relations: ["problem", "user"]
        });
        
        const submissionsView: SubmissionView[] = [];
        for (const submission of submissions) {
            const submissionView: SubmissionView = {
                id: submission.id,
                veredict: submission.veredict,
                executionDate: submission.time_judge,
                problemId: submission.problem.id,
                problemName: submission.problem.name,
                code_base64: undefined
            };
            submissionsView.push(submissionView);
        }
        return res.status(200).json(submissionsView);
    }
    catch (error: unknown) {
        if (error instanceof Error) {
            return res.status(400).send({ message: error.message });
        }
        else {
            return res.status(400).send({ message: "Something went wrong" });
        }
    }
};