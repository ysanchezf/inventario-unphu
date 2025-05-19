import { useQuery } from "react-query";
import axios from "axios";
import { RequestForm } from "../../components/RequestForm";

export default function SolicitudesPage() {
  const { data: items } = useQuery("items", () =>
    axios.get("/api/items").then((r) => r.data)
  );
  const { data: sols, refetch } = useQuery("solicitudes", () =>
    axios.get("/api/solicitudes").then((r) => r.data)
  );

  const approve = async (id: number, estado: string) => {
    await axios.patch(`/api/solicitudes/${id}`, { estado });
    refetch();
  };

  return (
    <div>
      <h1>Crear Solicitud</h1>
      <RequestForm items={items || []} />

      <h2>Mis Solicitudes</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Fecha Uso</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sols?.map((s: any) => (
            <tr key={s.id}>
              <td>{s.item.nombre}</td>
              <td>{new Date(s.fechaUso).toLocaleDateString()}</td>
              <td>{s.estado}</td>
              <td>
                {s.estado === "PENDIENTE" && (sessionStorage.getItem("role")==="ADMIN") && (
                  <>
                    <button onClick={() => approve(s.id, "APROBADA")}>Aprobar</button>
                    <button onClick={() => approve(s.id, "RECHAZADA")}>Rechazar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
