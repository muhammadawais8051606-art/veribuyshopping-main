import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { UserPlus, Trash2, Crown, Wrench, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/seller/team")({
  component: TeamPage,
});

type Member = {
  id: string; invited_email: string;
  team_role: "owner" | "operations";
  member_user_id: string | null;
};

function TeamPage() {
  const { user, sellerScopeId, sellerTeamRole } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"operations" | "owner">("operations");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (sellerTeamRole !== "owner") { navigate({ to: "/seller" }); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sellerTeamRole]);

  const load = async () => {
    if (!sellerScopeId) return;
    const { data } = await supabase.from("seller_team_members")
      .select("id, invited_email, team_role, member_user_id")
      .eq("seller_owner_id", sellerScopeId).order("created_at", { ascending: true });
    setMembers((data ?? []) as Member[]);
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerScopeId || !email.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("seller_team_members").insert({
      seller_owner_id: sellerScopeId, invited_email: email.trim().toLowerCase(), team_role: role,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Invitation added. They'll get access when they sign up with this email.");
    setEmail(""); load();
  };

  const remove = async (m: Member) => {
    if (m.member_user_id === sellerScopeId) return toast.error("Cannot remove the primary owner.");
    const { error } = await supabase.from("seller_team_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Invite a teammate</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Operations staff can manage products, inventory, and order fulfillment. They cannot see revenue, payouts, or team settings.
        </p>
        <form onSubmit={invite} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div>
            <Label htmlFor="email" className="mb-1 flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com" />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "operations" | "owner")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="operations">Operations Staff</SelectItem>
                <SelectItem value="owner">Account Manager (Owner)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary-hover w-full md:w-auto">
              <UserPlus className="mr-1 h-4 w-4" /> Invite
            </Button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No teammates yet.</td></tr>
            ) : members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">{m.invited_email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                    ${m.team_role === "owner" ? "bg-primary/15 text-primary" : "bg-accent text-foreground"}`}>
                    {m.team_role === "owner" ? <Crown className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                    {m.team_role === "owner" ? "Owner" : "Operations"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {m.member_user_id ? (
                    <span className="text-success text-xs font-medium">Active</span>
                  ) : (
                    <span className="text-warning text-xs font-medium">Invited</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.member_user_id !== sellerScopeId && (
                    <Button size="sm" variant="ghost" onClick={() => remove(m)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
