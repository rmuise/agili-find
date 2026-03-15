// Legacy prototype page — redirect to homepage which has a built-in map view toggle.
// The SVG mock map with Ottawa data has been retired.
import { redirect } from 'next/navigation';

export default function MapPage() {
  redirect('/');
}
