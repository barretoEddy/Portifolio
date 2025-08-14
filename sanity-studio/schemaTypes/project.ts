export default {
  name: 'project',
  title: 'Projeto',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Título',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug (URL Amigável)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'mainImage',
      title: 'Imagem Principal',
      type: 'image',
      options: {
        hotspot: true, // Permite recortar a imagem de forma inteligente
      },
    },
    {
      name: 'description',
      title: 'Descrição',
      type: 'text',
    },
    {
      name: 'technologies',
      title: 'Tecnologias',
      type: 'array',
      of: [{type: 'string'}],
    },
    {
      name: 'liveUrl',
      title: 'URL do Projeto (Live)',
      type: 'url',
    },
    {
      name: 'repoUrl',
      title: 'URL do Repositório (GitHub)',
      type: 'url',
    },
  ],
}
