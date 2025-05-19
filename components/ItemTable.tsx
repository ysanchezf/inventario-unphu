// components/ItemTable.tsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function ItemTable() {
  const { data, isLoading, error } = useQuery(['items'], () =>
    axios.get('/api/items').then(res => res.data)
  );

  if (isLoading) return <p>Cargando items…</p>;
  if (error) return <p>Error al cargar items.</p>;

  return (
    <table className="min-w-full border">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Nombre</th>
          <th className="px-4 py-2 text-left">Departamento</th>
          <th className="px-4 py-2 text-left">Disponibles</th>
        </tr>
      </thead>
      <tbody>
        {data.map((it: any) => (
          <tr key={it.id} className="border-t">
            <td className="px-4 py-2">{it.nombre}</td>
            <td className="px-4 py-2">{it.departamento.nombre}</td>
            <td className="px-4 py-2">{it.cantidadDisponible}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
