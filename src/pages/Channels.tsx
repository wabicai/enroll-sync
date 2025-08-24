import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchChannelTags, createChannelTag, updateChannelTag, deleteChannelTag, fetchChannelStats } from "@/lib/api";

interface ChannelTag {
  id: number;
  tag_name: string;
  tag_color?: string;
  tag_category?: string;
}

export default function Channels() {
  const [tags, setTags] = useState<ChannelTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTag, setCurrentTag] = useState<Partial<ChannelTag>>({});
  const [stats, setStats] = useState<any[]>([]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const fetchedTags = await fetchChannelTags();
      setTags(fetchedTags);
    } catch (error) {
      console.error("Failed to fetch channel tags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
    fetchChannelStats().then(setStats).catch(err => console.error("Failed to fetch stats:", err));
  }, []);

  const handleSave = async () => {
    try {
      if (isEditing && currentTag.id) {
        await updateChannelTag(currentTag.id, { tag_name: currentTag.tag_name });
      } else {
        await createChannelTag({ tag_name: currentTag.tag_name! });
      }
      setOpen(false);
      loadTags();
    } catch (error) {
      console.error("Failed to save tag:", error);
    }
  };

  const handleDelete = async (tagId: number) => {
    if (window.confirm("确定要删除这个标签吗？")) {
      try {
        await deleteChannelTag(tagId);
        loadTags();
      } catch (error) {
        console.error("Failed to delete tag:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">渠道管理</h1>
          <p className="text-muted-foreground">管理渠道标签和统计数据</p>
        </div>
        <Button onClick={() => { setIsEditing(false); setCurrentTag({}); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          添加标签
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>渠道标签列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>标签名称</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.id}</TableCell>
                  <TableCell>{tag.tag_name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setIsEditing(true); setCurrentTag(tag); setOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>渠道统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel_name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="student_count" fill="#8884d8" name="学员数" />
                <Bar yAxisId="right" dataKey="total_revenue" fill="#82ca9d" name="总收入" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑标签" : "添加标签"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tag_name" className="text-right">名称</Label>
              <Input
                id="tag_name"
                value={currentTag.tag_name || ""}
                onChange={(e) => setCurrentTag({ ...currentTag, tag_name: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

