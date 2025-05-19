import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DepartamentoSchema } from "../lib/zodSchemas";
import axios from "axios";

export function DepartmentForm({ onSaved, initial }: any) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(DepartamentoSchema),
    defaultValues: initial || {},
  });

  const onSubmit = async (data: any) => {
    const method = initial?.id ? "PUT" : "POST";
    const url = "/api/departamentos";
    await axios({ method, url, data: initial?.id ? { id: initial.id, ...data } : data });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("nombre")} placeholder="Nombre" />
      <textarea {...register("descripcion")} placeholder="Descripción" />
      <button disabled={formState.isSubmitting}>
        {initial ? "Actualizar" : "Crear"}
      </button>
    </form>
  );
}
