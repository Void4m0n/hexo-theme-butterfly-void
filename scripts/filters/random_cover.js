/**
 * Random cover for posts
 */

'use strict'

hexo.extend.generator.register('post', locals => {
  const imgTestReg = /\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i
  const videoTestReg = /\.(mp4|webm)(\?.*)?$/i
  const { post_asset_folder: postAssetFolder } = hexo.config
  const { cover: { default_cover: defaultCover } } = hexo.theme.config

  function * createCoverGenerator () {
    if (!defaultCover) {
      while (true) yield false
    }
    if (!Array.isArray(defaultCover)) {
      while (true) yield defaultCover
    }

    const coverCount = defaultCover.length
    if (coverCount === 1) {
      while (true) yield defaultCover[0]
    }

    const maxHistory = Math.min(3, coverCount - 1)
    const history = []

    while (true) {
      let index
      do {
        index = Math.floor(Math.random() * coverCount)
      } while (history.includes(index))

      history.push(index)
      if (history.length > maxHistory) history.shift()

      yield defaultCover[index]
    }
  }

  const coverGenerator = createCoverGenerator()

  const handleVideo = data => {
    let { cover_video_parameters: coverVideoParameters, pagination_video_parameters: paginationVideoParameters } = data

    if (!coverVideoParameters || typeof coverVideoParameters !== 'object') coverVideoParameters = {}
    if (!paginationVideoParameters || typeof paginationVideoParameters !== 'object') paginationVideoParameters = {}

    let { post_video_cover: postVideoCover } = coverVideoParameters

    if (typeof postVideoCover === 'string') postVideoCover = postVideoCover.trim()

    coverVideoParameters.post_video_cover = postVideoCover
    coverVideoParameters.autoplay = coverVideoParameters.autoplay ?? false
    coverVideoParameters.loop = coverVideoParameters.loop ?? false

    if (postAssetFolder && postVideoCover && postVideoCover.indexOf('/') === -1 && imgTestReg.test(postVideoCover)) {
      coverVideoParameters.post_video_cover = `${data.path}${postVideoCover}`
    }

    let { pagination_video_poster: paginationVideoPoster } = paginationVideoParameters

    if (typeof paginationVideoPoster === 'string') paginationVideoPoster = paginationVideoPoster.trim()

    paginationVideoParameters.pagination_video_poster = paginationVideoPoster
    paginationVideoParameters.autoplay = paginationVideoParameters.autoplay ?? false
    paginationVideoParameters.loop = paginationVideoParameters.loop ?? false

    if (postAssetFolder && paginationVideoPoster && paginationVideoPoster.indexOf('/') === -1 && imgTestReg.test(paginationVideoPoster)) {
      paginationVideoParameters.pagination_video_poster = `${data.path}${paginationVideoPoster}`
    }

    data.cover_video_parameters = coverVideoParameters
    data.pagination_video_parameters = paginationVideoParameters

    return data
  }

  const handleImg = data => {
    data = handleVideo(data)
    let {
      cover: coverVal,
      top_img: topImg,
      pagination_cover: paginationCover,
      recent_post_cover: recentPostCover,
      article_sort_cover: articleSortCover
    } = data

    if (postAssetFolder) {
      if (topImg && topImg.indexOf('/') === -1 && imgTestReg.test(topImg)) {
        data.top_img = `${data.path}${topImg}`
      }
      if (coverVal && coverVal.indexOf('/') === -1 && (imgTestReg.test(coverVal) || videoTestReg.test(coverVal))) {
        data.cover = `${data.path}${coverVal}`
      }
      if (paginationCover && paginationCover.indexOf('/') === -1 && (imgTestReg.test(paginationCover) || videoTestReg.test(paginationCover))) {
        data.pagination_cover = `${data.path}${paginationCover}`
      }
      if (recentPostCover && recentPostCover.indexOf('/') === -1 && imgTestReg.test(recentPostCover)) {
        data.recent_post_cover = `${data.path}${recentPostCover}`
      }
      if (articleSortCover && articleSortCover.indexOf('/') === -1 && (imgTestReg.test(articleSortCover) || videoTestReg.test(articleSortCover))) {
        data.article_sort_cover = `${data.path}${articleSortCover}`
      }
    }

    if (paginationCover && videoTestReg.test(paginationCover)) {
      data.pagination_cover_type = 'video'
      data.pagination_cover_mime = /\.webm(\?.*)?$/i.test(paginationCover) ? 'video/webm' : 'video/mp4'
    } else if (paginationCover && (paginationCover.indexOf('//') !== -1 || imgTestReg.test(paginationCover))) {
      data.pagination_cover_type = 'img'
    }

    if (articleSortCover && videoTestReg.test(articleSortCover)) {
      data.article_sort_cover_type = 'video'
      data.article_sort_cover_mime = /\.webm(\?.*)?$/i.test(articleSortCover) ? 'video/webm' : 'video/mp4'
    } else if (articleSortCover && (articleSortCover.indexOf('//') !== -1 || imgTestReg.test(articleSortCover))) {
      data.article_sort_cover_type = 'img'
    }

    if (recentPostCover && (recentPostCover.indexOf('//') !== -1 || imgTestReg.test(recentPostCover))) {
      data.recent_post_cover_type = 'img'
    }

    if (coverVal === false) return data

    if (!coverVal) {
      const randomCover = coverGenerator.next().value
      data.cover = randomCover
      coverVal = randomCover
    }

    if (coverVal && videoTestReg.test(coverVal)) {
      data.cover_type = 'video'
      data.cover_mime = /\.webm(\?.*)?$/i.test(coverVal) ? 'video/webm' : 'video/mp4'
    } else if (coverVal && (coverVal.indexOf('//') !== -1 || imgTestReg.test(coverVal))) {
      data.cover_type = 'img'
    }

    return data
  }

  const posts = locals.posts.sort('date').toArray()
  const { length } = posts

  return posts.map((post, i) => {
    if (i) post.prev = posts[i - 1]
    if (i < length - 1) post.next = posts[i + 1]

    post.__post = true

    return {
      data: handleImg(post),
      layout: 'post',
      path: post.path
    }
  })
})
