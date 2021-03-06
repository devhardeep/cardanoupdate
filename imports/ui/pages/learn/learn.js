import './learn.html'

import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { Learn } from '/imports/api/learn/learn'

import { removeLearningItem, flagLearningItem } from '/imports/api/learn/methods'
import swal from 'sweetalert2'

import { notify } from '/imports/modules/notifier'
import { flagDialog } from '/imports/modules/flagDialog'

const CHUNK_SIZE = 3

Template.learn.onCreated(function () {
    this.sort = new ReactiveVar('date-desc')
    this.searchFilter = new ReactiveVar('')
    
    this.autorun(() => {
        this.subscribe('learn')
    })
})

Template.learn.helpers({
    chunkSize: () => CHUNK_SIZE + 1,
    learn: () => {
        let learn = []
        let searchText = Template.instance().searchFilter.get()

        if (searchText) {
            learn = Learn.find({
                $or: [{
                    content: new RegExp(searchText.replace(/ /g, '|'), 'ig')
                }, {
                    title: new RegExp(searchText.replace(/ /g, '|'), 'ig')
                }]
            })
        } else {
            learn = Learn.find({})
        }

        return learn
    },
    canEdit: function() {
        return this.createdBy === Meteor.userId()
    }
})

Template.learn.events({
    'click #new-learn': (event, templateInstance) => {
        event.preventDefault()

        FlowRouter.go('/learn/new')
    },
    'click #js-remove': function (event, templateInstance) {
        event.preventDefault()
        
        swal({
            text: `Are you sure you want to remove this learning resource? This action is not reversible.`,
            type: 'warning',
            showCancelButton: true 
        }).then(confirmed => {
            if (confirmed.value) {
                removeLearningItem.call({
                    learnId: this._id
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    }
                })
            }
        })
    },
    'keyup #searchBox': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.searchFilter.set($('#searchBox').val())
    },
    'click .flag-learn' : function(event, templateInstance) {
        event.preventDefault()

        flagDialog.call(this, flagLearningItem, 'learnId')
    }
})
