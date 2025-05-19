import { useQuery } from "react-query";
import axios from "axios";
import { DepartmentForm } from "../../components/DepartmentForm";

export default function DeptPage() {
  const { data, refetch } = useQuery("deps", () =>
    axios.get("/api/departamentos").then((r) => r.data)
  );

  return (
    <div>
      <h1>Departamentos</h1>
      <DepartmentForm onSaved={refetch} />
      <ul>
        {data?.map((d: any) => (
          <li key={d.id}>
            {d.nombre}
            {/* aquí podrías agregar botón de editar/borrar */}
          </li>
        ))}
      </ul>
    </div>
  );
}
