import { Meteor } from 'meteor/meteor'

import { Comments } from '../comments'

Meteor.publish('comments.news', (newsId) => {
	return Comments.find({
		parentId: newsId
	}, {
		sort: {
			createdAt: -1
		}
	})
})

Meteor.publish('comments', () => {
	return Comments.find({}, {
		sort: {
			createdAt: -1
		}
	})
})

Meteor.publish('comments.flagged', () => {
	return Comments.find({
		'flags.0': {
			$exists: true
		}
	}, {
		sort: {
			createdAt: -1
		}
	})
})
