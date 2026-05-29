import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const projectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  client_name: z.string().min(1, 'Nome do cliente é obrigatório'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  deadline_date: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project || {
      status: 'planning',
    },
  });

  React.useEffect(() => {
    if (project) {
      Object.keys(project).forEach((key) => {
        setValue(key as any, project[key as keyof typeof project]);
      });
    }
  }, [project, setValue]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEditing) {
        await api.put(`/projects/${id}`, data);
        toast({ title: 'Projeto atualizado com sucesso' });
      } else {
        await api.post('/projects', data);
        toast({ title: 'Projeto criado com sucesso' });
      }
      navigate('/projects');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar projeto',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
        </h1>
        <p className="text-slate-600 mt-2">
          {isEditing ? 'Atualize as informações do projeto' : 'Preencha os dados para criar um novo projeto'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Cliente *</Label>
                <Input id="client_name" {...register('client_name')} />
                {errors.client_name && <p className="text-sm text-destructive">{errors.client_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input id="location" {...register('location')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="on_hold">Pausado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input id="start_date" type="date" {...register('start_date')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline_date">Prazo de Entrega</Label>
                <Input id="deadline_date" type="date" {...register('deadline_date')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={4} {...register('description')} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Projeto'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectForm;
