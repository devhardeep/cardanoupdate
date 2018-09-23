import './viewNews.html'

import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'

import { News } from '/imports/api/news/news'
import { Comments } from '/imports/api/comments/comments'

import { newComment, editComment, removeComment, flagComment } from '/imports/api/comments/methods' 
import { flagNews } from '/imports/api/news/methods'

import { notify } from '/imports/modules/notifier'

import swal from 'sweetalert2'

Template.viewNews.onCreated(function() {
	this.autorun(() => {
		this.subscribe('news.item', FlowRouter.getParam('slug'))
		this.subscribe('users')

		let news = News.findOne({
			slug: FlowRouter.getParam('slug')
		})

		if (news) {
			this.subscribe('comments.news', news._id)
		}
	})

	this.edits = new ReactiveDict()
	this.message = new ReactiveVar('')
})

Template.viewNews.helpers({
	news: () => News.findOne({
		slug: FlowRouter.getParam('slug')
	}),
	author: function() {
        return (Meteor.users.findOne({
            _id: this.createdBy
        }) || {}).username || ''
    },
    comments: () => {
    	let news = News.findOne({
			slug: FlowRouter.getParam('slug')
		}) || {}

    	return Comments.find({
    		parentId: news._id
    	})
    },
    canEditComment: function() {
    	return this.createdBy === Meteor.userId()
    },
    editMode: function() {
    	return Template.instance().edits.get(this._id)
    },
    commentInvalidMessage: () => Template.instance().message.get()
})

Template.viewNews.events({
	'click .flag-news': (event, templateInstance) => {
		let news = News.findOne({
			slug: FlowRouter.getParam('slug')
		}) || {}

		swal({
		  	title: 'Why are you flagging this?',
		  	input: 'text',
		  	showCancelButton: true,
		  	inputValidator: (value) => {
		    	return !value && 'You need to write a valid reason!'
		  	}
		}).then(data => {
			if (data.value) {
				flagNews.call({
					newsId: news._id,
					reason: data.value
				}, (err, data) => {
					if (err) {
						notify(err.reason || err.message, 'error')
					} else {
						notify('Successfully flagged. Moderators will decide what to do next.', 'success')
					}
				})
			}
		})
	},
	'click .flag-comment': function(event, templateInstance) {
		swal({
		  	title: 'Why are you flagging this?',
		  	input: 'text',
		  	showCancelButton: true,
		  	inputValidator: (value) => {
		    	return !value && 'You need to write a valid reason!'
		  	}
		}).then(data => {
			if (data.value) {
				flagComment.call({
					commentId: this._id,
					reason: data.value
				}, (err, data) => {
					if (err) {
						notify(err.reason || err.message, 'error')
					} else {
						notify('Successfully flagged. Moderators will decide what to do next.', 'success')
					}
				})
			}
		})
	},
	'click .new-comment': (event, templateInstance) => {
		event.preventDefault()

		let news = News.findOne({
			slug: FlowRouter.getParam('slug')
		})

		newComment.call({
			parentId: news._id,
			text: $('#comments').val()
		}, (err, data) => {
			if (!err) {
				notify('Successfully commented.', 'success')
				templateInstance.message.set('')
			} else {
				templateInstance.message.set(err.reason || err.message)
			}
		})
	},
	'click .edit-mode': function(event, templateInstance) {
		event.preventDefault()

		templateInstance.edits.set(this._id, true)
	},
	'click .delete-comment': function(event, templateInstance) {
		event.preventDefault()

		swal({
            text: `Are you sure you want to remove this comment? This action is not reversible.`,
            type: 'warning',
            showCancelButton: true
        }).then(confirmed => {
            if (confirmed.value) {
                removeComment.call({
                    commentId: this._id
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    }
                })
            }
        })
	},
	'click .edit-comment': function(event, templateInstance) {
		event.preventDefault()

		editComment.call({
			commentId: this._id,
			text: $('#js-comment').val()
		}, (err, data) => {
			if (err) {
                notify(err.reason || err.message, 'error')
            } else {
            	notify('Successfully edited.', 'success')
            	templateInstance.edits.set(this._id, false)
            }
		})
	},
	'click .cancel-edit': function(event, templateInstance) {
		event.preventDefault()

		templateInstance.edits.set(this._id, false)
	}
})
