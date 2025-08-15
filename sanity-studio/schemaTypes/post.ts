// sanity-studio/schemas/post.ts

export default {
  name: 'post',
  title: 'Post do Blog',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Título',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
        name: 'excerpt',
        title: 'Resumo (Excerpt)',
        type: 'text',
        rows: 2,
        description: 'Um resumo curto do post para a listagem do blog.'
    },
    {
      name: 'mainImage',
      title: 'Imagem de Capa',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'body',
      title: 'Corpo do Post',
      type: 'markdown',
    },
    {
        name: 'publishedAt',
        title: 'Data de Publicação',
        type: 'datetime',
    }
  ],

  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
    },
  },
}
