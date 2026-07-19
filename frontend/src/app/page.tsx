import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kombin Asistanı</h1>
        <Badge variant="secondary">0 Tokens</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bugün Ne Giyeceksin?</CardTitle>
          <CardDescription>Hemen sohbete başla ve tarzını bul.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-100 p-4 rounded-xl text-sm text-slate-500">
            Sohbet ekranına giderek AI asistanınızdan kombin önerileri alabilirsiniz.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
