import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SolicitudCreateSchema } from "../lib/zodSchemas";
import axios from "axios";
import { useQueryClient } from "react-query";

export function RequestForm({ items }: { items: any[] }) {
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(SolicitudCreateSchema),
  });

  const onSubmit = async (data: any) => {
    await axios.post("/api/solicitudes", data);
    qc.invalidateQueries("solicitudes");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <select {...register("itemId")}>
        {items.map((it) => (
          <option key={it.id} value={it.id}>
            {it.nombre}
          </option>
        ))}
      </select>
      <input type="date" {...register("fechaUso")} />
      <input type="time" {...register("horaInicio")} />
      <input type="time" {...register("horaFin")} />
      <textarea {...register("motivo")} placeholder="Motivo" />
      <button>Solicitar</button>
    </form>
  );
}
