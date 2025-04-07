import { Router } from "express";
import { getPacientes, addPaciente, updatePaciente  } from "../controllers/pacienteController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/getPacientes', asyncHandler(getPacientes));
router.post('/insertPaciente', asyncHandler(addPaciente));
router.patch('/updatePaciente', asyncHandler(updatePaciente));

export default router;