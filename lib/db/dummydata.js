// 'use strict';

var mongoose = require('mongoose');
var async = require('async');


function ModelClear(Model, cb) {
  Model.find({}).remove(cb);
}

// for (var m in mongoose.models) {
//   (function(name){
//     ModelClear(mongoose.model(name), function() {
//       console.info('.. cleared', name);
//     });
//   }(m));
// }




var tumblrClient = require('tumblr.js').createClient({
  consumer_key: 'm5jC4oU0RzjO3DG2Ky2aUdCK0xBrgA1nQe3EvaWImC5aUCiTcJ',
  consumer_secret: 'lnnb9ct6cWQw6dJu2Xw806GrNrMyBGVbWC6kkw26W3IQ7hYTWS',
  token: 'R75YkQFCmAuAkxtwNRdkPnQzqsNh3JQt1IgxpOVAG9BZ0JFvwr',
  token_secret: 'GaV1kAeRXiQEbsALmb4CZ5TsUVAYkc6NHihPaEQF34lq0EStLd'
});

function docIds(documents, idName) {
  idName = idName || '_id';
  var ids = [];
  for (var d in documents) {
    ids.push(documents[d][idName]);
  }
  return ids;
}


function processTumblrPostPhotos(item, photoCb) {
  async.mapSeries(item.tumblr.photos || [], function(photo, cb) {
    item.image = item.image || photo.original_size.url;
    mongoose.model('ImageObject').findOrCreate({
      url: photo.original_size.url
    }, {
      url: photo.original_size.url,
      image: photo.original_size.url,
      name: 'Picture from '+ (item.tumblr.source_title || item.tumblr.blog_name)
    }, cb);
  }, function(err, photos) {
    photoCb(err, item);
  });
}

function processTumblrPostAuthor(item, authorCb) {
  mongoose.model('Person').findOrCreate({
    name: 'tumblr:'+ (item.tumblr.source_title || item.tumblr.blog_name)
  }, {
    name: 'tumblr:'+ (item.tumblr.source_title || item.tumblr.blog_name),
    url: 'http://'+ (item.tumblr.blog_name || item.tumblr.source_title) +'.tumblr.com',
    description: 'A tumblr blog'
  }, function(err, author) {
    item.author = [author._id];
    authorCb(err, item);
  });
  // item.author = {
  //   name: item.tumblr.source_title || item.tumblr.blog_name,
  //   url: item.tumblr.source_url || item.tumblr.post_url,
  //   description: 'A blog'
  // };
  // authorCb(null, item);
}

function processTumblrPostVideo(item, videoCb) {
  if (item.tumblr.video_url) {
    mongoose.model('VideoObject').findOrCreate({
      url: item.tumblr.video_url
    }, {
      url: item.tumblr.video_url
    }, function(err, video) {
      item.videos = [video._id];
      videoCb(err, item);
    });
  }
  else {
    videoCb(null, item);
  }
  // if (item.tumblr.video_url) {
  //   item.image = item.image || item.tumblr.thumbnail_url;
  //   item.videos = [{
  //     name: 'Video from '+ (
  //       item.tumblr.caption ||
  //       item.tumblr.source_title ||
  //       item.tumblr.blog_name
  //     ),
  //     url: item.tumblr.video_url,
  //     image: item.tumblr.thumbnail_url
  //   }];
  // }
  // videoCb(null, item);
}


function processTumblrPost(item, itemCb) {
  console.info('preparing tumblr post', [[item]]);

  processTumblrPostAuthor(item, function(err, item) {
    if (err) {
      return itemCb(err);
    }
    console.info('prepared post author', [[item.author]]);

    processTumblrPostVideo(item, function(err, item) {
      if (err) {
        return itemCb(err);
      }
      console.info('prepared post videos', item.videos);

      processTumblrPostPhotos(item, function(err, item) {
        if (err) {
          return itemCb(err);
        }
        console.info('prepared post photos', item.image);

        itemCb(null, item);
      });
    });
  });
}



function processTumblrPosts(posts, postCb) {
  var items = [];
  for (var p in posts) {
    var post = posts[p];
    items.push({
      image: (function(){
        if (post.type === 'photo') {
          return post.photos[0].original_size.url;
        }
      }()),
      description: 'A tumblr '+ post.type +' post from .tumblr.com',
      tumblr: post,
      datePublished: post.date,
      url: post.short_url,
      tumblr_id: post.id
    });
  }

  console.info('processing posts', items.length);

  async.mapSeries(items, processTumblrPost, function(err, processed) {
    console.info('processed', [[processed]]);
    postCb(err, processed);
  });
}

var _tumblrLikes = 0;
function fetchTumblrLikes() {
  // Make the request
  tumblrClient.likes({}, function (err, data) {
    if (err) {
      console.info('Error while fetching likes from tumblr', err.stack);
      return;
    }

    console.info('posts to process', data.liked_posts.length);

    processTumblrPosts(data.liked_posts, function(err, items) {
      if (err) {
        console.info('error while processing the tumblr posts', err.stack);
        return;
      }
      
      console.info('processTumblrPosts', [[items]]);

      async.mapSeries(items, function(post, cb) {
        mongoose.model('TumblrPost').findOrCreate({
          tumblr_id: post.tumblr_id
        }, post, cb);
      }, function(err, posts) {
        if (err) {
          console.info('an error occured while creating the tumblr posts', items.length, err.stack);
          return;
        }

        console.info('created or found', posts.length, docIds(posts));

        if (_tumblrLikes && data.liked_count && _tumblrLikes !== data.liked_count) {
          _tumblrLikes = data.liked_count;
          setTimeout(fetchTumblrLikes, 5000);
        }
      });
    });
  });
}

// fetchTumblrLikes();

