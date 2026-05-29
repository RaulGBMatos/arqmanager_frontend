import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Trash2, 
  Check,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { Project, Stage, ProjectFile, ProjectImage, Note } from '@/types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const [expandedStages, setExpandedStages] = React.useState<Record<number, boolean>>({});

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingStage, setEditingStage] = React.useState<Stage | null>(null);

  // Gallery Dialog States
  const [isUploadImageOpen, setIsUploadImageOpen] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageCaption, setImageCaption] = React.useState('');
  const [zoomedImage, setZoomedImage] = React.useState<ProjectImage | null>(null);

  // Notes Dialog States
  const [isCreateNoteOpen, setIsCreateNoteOpen] = React.useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [noteContent, setNoteContent] = React.useState('');

  // Form Fields State for Stages
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [expectedDate, setExpectedDate] = React.useState('');
  const [responsible, setResponsible] = React.useState('');

  // Queries
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: stages } = useQuery<Stage[]>({
    queryKey: ['stages', id],
    queryFn: async () => {
      const response = await api.get(`/stages/project/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: files } = useQuery<ProjectFile[]>({
    queryKey: ['files', id],
    queryFn: async () => {
      const response = await api.get(`/files/projects/${id}/files`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: images } = useQuery<ProjectImage[]>({
    queryKey: ['images', id],
    queryFn: async () => {
      const response = await api.get(`/files/projects/${id}/images`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: notes } = useQuery<Note[]>({
    queryKey: ['notes', id],
    queryFn: async () => {
      const response = await api.get(`/notes/project/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Project Status Mutation
  const updateProjectStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return api.put(`/projects/${id}`, {
        name: project?.name,
        client_name: project?.client_name,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Status do projeto atualizado!' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  // Stages Mutations
  const createStageMutation = useMutation({
    mutationFn: async (newStage: Partial<Stage>) => {
      return api.post(`/stages/project/${id}`, newStage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: "Etapa criada com sucesso!" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar etapa",
        description: error.response?.data?.detail || "Tente novamente",
      });
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, data }: { stageId: number, data: Partial<Stage> }) => {
      return api.put(`/stages/${stageId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: "Etapa atualizada com sucesso!" });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar etapa",
        description: error.response?.data?.detail || "Tente novamente",
      });
    }
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: number) => {
      return api.delete(`/stages/${stageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: "Etapa excluída com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir etapa",
        description: error.response?.data?.detail || "Tente novamente",
      });
    }
  });

  // Files Mutations
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/files/projects/${id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', id] });
      toast({ title: 'Arquivo enviado com sucesso!' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar arquivo',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return api.delete(`/files/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', id] });
      toast({ title: 'Arquivo excluído com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir arquivo',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  // Gallery Mutations
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) {
        formData.append('caption', caption);
      }
      return api.post(`/files/projects/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', id] });
      toast({ title: 'Imagem enviada com sucesso!' });
      setIsUploadImageOpen(false);
      setImageFile(null);
      setImageCaption('');
      if (imageInputRef.current) imageInputRef.current.value = '';
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar imagem',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return api.delete(`/files/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', id] });
      toast({ title: 'Imagem excluída com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir imagem',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  // Notes Mutations
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post(`/notes/project/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      toast({ title: 'Nota criada com sucesso!' });
      setIsCreateNoteOpen(false);
      setNoteContent('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar nota',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: number; content: string }) => {
      return api.put(`/notes/${noteId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      toast({ title: 'Nota atualizada com sucesso!' });
      setIsEditNoteOpen(false);
      setEditingNote(null);
      setNoteContent('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar nota',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return api.delete(`/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      toast({ title: 'Nota excluída com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir nota',
        description: error.response?.data?.detail || 'Tente novamente',
      });
    },
  });

  // Handlers
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExpectedDate('');
    setResponsible('');
    setEditingStage(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (stage: Stage) => {
    setEditingStage(stage);
    setTitle(stage.title);
    setDescription(stage.description || '');
    setExpectedDate(stage.expected_date || '');
    setResponsible(stage.responsible || '');
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    createStageMutation.mutate({
      title,
      description: description || undefined,
      expected_date: expectedDate || undefined,
      responsible: responsible || undefined,
      status: 'pending',
      order_index: stages ? stages.length : 0,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !title.trim()) return;

    updateStageMutation.mutate({
      stageId: editingStage.id,
      data: {
        title,
        description: description || undefined,
        expected_date: expectedDate || undefined,
        responsible: responsible || undefined,
      }
    });
  };

  const toggleComplete = (stage: Stage) => {
    const newStatus = stage.status === 'completed' ? 'pending' : 'completed';
    updateStageMutation.mutate({
      stageId: stage.id,
      data: {
        status: newStatus
      }
    });
  };

  const handleDeleteStage = (stageId: number) => {
    if (window.confirm('Tem certeza de que deseja excluir esta etapa?')) {
      deleteStageMutation.mutate(stageId);
    }
  };

  const toggleExpand = (stageId: number) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadFileMutation.mutate(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    uploadImageMutation.mutate({ file: imageFile, caption: imageCaption });
  };

  const openAddNoteModal = () => {
    setNoteContent('');
    setEditingNote(null);
    setIsCreateNoteOpen(true);
  };

  const openEditNoteModal = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setIsEditNoteOpen(true);
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    if (editingNote) {
      updateNoteMutation.mutate({ noteId: editingNote.id, content: noteContent });
    } else {
      createNoteMutation.mutate(noteContent);
    }
  };

  const handleDeleteNote = (noteId: number) => {
    if (window.confirm('Tem certeza de que deseja excluir esta nota?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleDeleteImage = (imageId: number) => {
    if (window.confirm('Tem certeza de que deseja excluir esta imagem?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const handleDeleteFile = (fileId: number) => {
    if (window.confirm('Tem certeza de que deseja excluir este arquivo?')) {
      deleteFileMutation.mutate(fileId);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-600 font-medium">Carregando...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-slate-600 font-medium">Projeto não encontrado</div>;
  }

  const completedStages = stages?.filter(s => s.status === 'completed').length || 0;
  const totalStages = stages?.length || 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link to="/projects">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
        <p className="text-slate-600 mt-2">{project.client_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progresso do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso Geral</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{completedStages}</p>
                  <p className="text-sm text-slate-600">Etapas Concluídas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-600">{totalStages}</p>
                  <p className="text-sm text-slate-600">Total de Etapas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1.5 font-medium">Status do Projeto</p>
              <Select 
                value={project.status} 
                onValueChange={(val) => updateProjectStatusMutation.mutate(val)}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
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

            {project.location && (
              <div>
                <p className="text-sm text-slate-600">Localização</p>
                <p className="font-medium">{project.location}</p>
              </div>
            )}
            {project.start_date && (
              <div>
                <p className="text-sm text-slate-600">Data de Início</p>
                <p className="font-medium">{new Date(project.start_date).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {project.deadline_date && (
              <div>
                <p className="text-sm text-slate-600">Prazo de Entrega</p>
                <p className="font-medium">{new Date(project.deadline_date).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {project.description && (
              <div>
                <p className="text-sm text-slate-600">Descrição</p>
                <p className="font-medium text-sm text-slate-700 leading-relaxed">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stages">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="stages">Etapas</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        {/* STAGES TAB */}
        <TabsContent value="stages" className="mt-6">
          <Card>
            <CardHeader className="space-y-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Etapas do projeto</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Marque as etapas conforme forem concluídas.</p>
                </div>
                
                <div className="flex items-center gap-4 self-end sm:self-center">
                  {stages && stages.length > 0 && (
                    <div className="flex flex-col items-end gap-1 min-w-[180px]">
                      <span className="text-xs text-slate-600 font-medium">
                        {completedStages} de {totalStages} etapas concluídas
                      </span>
                      <div className="w-32 bg-slate-100 rounded-full h-1.5">
                        <div 
                          className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${totalStages > 0 ? (completedStages / totalStages) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button size="sm" onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Nova Etapa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stages && stages.length > 0 ? (
                <div className="space-y-0 pl-2">
                  {stages.map((stage, idx) => {
                    const isCompleted = stage.status === 'completed';
                    const isExpanded = !!expandedStages[stage.id];

                    return (
                      <div key={stage.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Timeline Line Connector */}
                        {idx < stages.length - 1 && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        
                        {/* Circle Status Toggle Button */}
                        <div className="relative z-10">
                          {isCompleted ? (
                            <button 
                              onClick={() => toggleComplete(stage)}
                              title="Marcar como pendente"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0 shadow-sm transition hover:bg-emerald-700"
                            >
                              <Check className="h-4 w-4 stroke-[3]" />
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleComplete(stage)}
                              title="Marcar como concluída"
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-500 font-semibold text-xs shrink-0 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600"
                            >
                              {idx + 1}
                            </button>
                          )}
                        </div>
                        
                        {/* Details Card */}
                        <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm hover:shadow transition duration-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <h3 className="font-semibold text-slate-800 text-base">
                                {idx + 1}. {stage.title}
                              </h3>
                              {stage.description && (
                                <p className="text-sm text-slate-600 pr-4 mt-0.5 leading-relaxed">
                                  {stage.description}
                                </p>
                              )}
                              
                              {/* Metadata indicators */}
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500">
                                {stage.expected_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Prazo: {formatDate(stage.expected_date)}</span>
                                  </span>
                                )}
                                {stage.responsible && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Responsável: {stage.responsible}</span>
                                  </span>
                                )}
                                {isCompleted && stage.completed_at && (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                    <span>Concluída em: {formatDate(stage.completed_at)}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Quick Action Button */}
                              {!isCompleted ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleComplete(stage)}
                                  className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  Marcar como concluída
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleComplete(stage)}
                                  className="h-8 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                >
                                  Reabrir
                                </Button>
                              )}

                              {/* Expansion Chevron */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500"
                                onClick={() => toggleExpand(stage.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Collapsible Action Panel */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(stage)}
                                className="h-8 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteStage(stage.id)}
                                className="h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <p>Nenhuma etapa criada ainda</p>
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Etapa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FILES TAB */}
        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Arquivos do Projeto</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Armazene PDFs, plantas, DWGs e outros documentos.</p>
              </div>
              <Button size="sm" onClick={triggerFileUpload} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Upload de Arquivo
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </CardHeader>
            <CardContent>
              {files && files.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-white">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition duration-150">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{file.file_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatFileSize(file.file_size)} • Enviado em {new Date(file.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-700">
                            <Download className="h-4.5 w-4.5" />
                          </Button>
                        </a>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteFile(file.id)}
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <p>Nenhum arquivo anexado ainda</p>
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={triggerFileUpload}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload de Arquivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GALLERY TAB */}
        <TabsContent value="gallery" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Galeria de Imagens</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Imagens de referência, renderizações 3D e fotos da obra.</p>
              </div>
              <Button size="sm" onClick={() => setIsUploadImageOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar Imagem
              </Button>
            </CardHeader>
            <CardContent>
              {images && images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {images.map((img) => (
                    <div key={img.id} className="group relative border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow transition duration-200">
                      <div className="relative h-48 w-full bg-slate-50 overflow-hidden">
                        <img 
                          src={img.image_url} 
                          alt={img.caption || ''} 
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition duration-200">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            onClick={() => setZoomedImage(img)}
                            className="h-9 w-9 bg-white text-slate-800 rounded-full hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleDeleteImage(img.id)}
                            className="h-9 w-9 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {img.caption && (
                        <div className="p-3 border-t border-slate-50 bg-white">
                          <p className="text-sm font-medium text-slate-700 truncate">{img.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <p>Nenhuma imagem adicionada ainda</p>
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setIsUploadImageOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Imagem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Notas e Observações</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Anotações internas, atas de reuniões e lembretes.</p>
              </div>
              <Button size="sm" onClick={openAddNoteModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar Nota
              </Button>
            </CardHeader>
            <CardContent>
              {notes && notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {notes.map((note) => (
                    <Card key={note.id} className="border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow transition duration-150">
                      <CardContent className="p-5 flex-1">
                        <p className="text-xs text-slate-500 mb-2 font-medium">
                          {new Date(note.created_at).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </CardContent>
                      <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-2 rounded-b-lg">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditNoteModal(note)}
                          className="h-8 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <p>Nenhuma nota adicionada ainda</p>
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openAddNoteModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Nota
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE STAGE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Etapa</DialogTitle>
            <DialogDescription>
              Adicione uma nova etapa para organizar o cronograma do projeto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-title">Título da Etapa *</Label>
              <Input
                id="create-title"
                placeholder="Ex: Briefing e levantamento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Descrição</Label>
              <Textarea
                id="create-description"
                placeholder="Descrição dos objetivos ou entregáveis da etapa"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-date">Data Limite / Prazo</Label>
                <Input
                  id="create-date"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-responsible">Responsável</Label>
                <Input
                  id="create-responsible"
                  placeholder="Ex: João Silva"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Criar Etapa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT STAGE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
            <DialogDescription>
              Modifique as informações da etapa selecionada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título da Etapa *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Data Limite / Prazo</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-responsible">Responsável</Label>
                <Input
                  id="edit-responsible"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* UPLOAD IMAGE DIALOG */}
      <Dialog open={isUploadImageOpen} onOpenChange={setIsUploadImageOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Imagem</DialogTitle>
            <DialogDescription>
              Selecione uma imagem e insira uma legenda opcional.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImageUploadSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="image-file">Selecionar Arquivo de Imagem *</Label>
              <Input 
                id="image-file" 
                type="file" 
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageFileChange} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-caption">Legenda / Título</Label>
              <Input 
                id="image-caption" 
                placeholder="Ex: Fachada Principal - Render 3D" 
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsUploadImageOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!imageFile} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Enviar Imagem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ZOOM IMAGE DIALOG */}
      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        <DialogContent className="sm:max-w-[700px] p-1 overflow-hidden bg-slate-900 border-none">
          {zoomedImage && (
            <div className="relative flex flex-col">
              <div className="max-h-[80vh] overflow-hidden flex items-center justify-center bg-black">
                <img 
                  src={zoomedImage.image_url} 
                  alt={zoomedImage.caption || ''} 
                  className="max-h-[80vh] max-w-full object-contain" 
                />
              </div>
              {zoomedImage.caption && (
                <div className="p-4 bg-slate-900 text-white text-sm font-medium border-t border-slate-800">
                  {zoomedImage.caption}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE NOTE DIALOG */}
      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Nova Nota</DialogTitle>
            <DialogDescription>
              Escreva observações ou lembretes rápidos sobre o projeto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNoteSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="note-content">Conteúdo *</Label>
              <Textarea 
                id="note-content" 
                placeholder="Digite o conteúdo da nota aqui..."
                rows={6}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateNoteOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Adicionar Nota
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT NOTE DIALOG */}
      <Dialog open={isEditNoteOpen} onOpenChange={setIsEditNoteOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Editar Nota</DialogTitle>
            <DialogDescription>
              Modifique o texto da nota selecionada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNoteSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-note-content">Conteúdo *</Label>
              <Textarea 
                id="edit-note-content" 
                rows={6}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditNoteOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;
