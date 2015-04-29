'use strict';

angular.module('app.gerrit').factory('GerritProject', ['appConfig', '$http', '$log', '$q', '$filter',
	function(appConfig , $http, $log, $q, $filter) {
		
		function GerritProject(projectName, projects) {
			this.projectName = projectName;			
			this.projects = projects;
			this.openChanges = 0;
			this.mergedChanges = 0;
			this.abandonedChanges = 0;
			this.totalNumberOfChanges = 0;
			this.openChangesCount = 0;
			this.mergedChangesCount = 0;
			this.abandonedChangesCount = 0;
			this.numberOfChanges = 0;
			this.noReviewChanges = 0;
			this.collaborativeDevChanges = 0;
			this.singlePeerChanges = 0;
			this.twoPlusPeerChanges = 0;	
			this.submitters = [];
			this.reviewers = [];
			this.promises = [];
		}
		
		// static members
		GerritProject.startDate = appConfig.gerrit.startDate;
		GerritProject.endDate = appConfig.gerrit.endDate;		
		GerritProject.botName = appConfig.gerrit.botName;
		
		GerritProject.getChanges = function (status) {				
			var gerritQuery = 'changes/?q=status:' + status;	
			
			return $http({
				url: appConfig.gerrit.proxy,
				method: 'GET',
				params: {query: gerritQuery}
			});
		}
		
		GerritProject.getChange = function (changeId) {			
			var gerritQuery = 'changes/' + changeId + '/?o=DETAILED_LABELS&o=ALL_REVISIONS&o=ALL_COMMITS';
			
			return $http({
				url: appConfig.gerrit.proxy,
				method: 'GET',
				params: {query: gerritQuery}
			});
		}
		
		// instance members
		GerritProject.prototype = {
			getProjectName: function() {
				return this.projectName;
			},
			generateReport: generateReport,
			analyseProjects: analyseProjects,
			analyseChanges: analyseChanges,
			processChange: processChange,
			analyseChange: analyseChange,
			generateReport: generateReport			
		}
		
		// method definitions
		function generateReport() {
			var startDateString = $filter('date')(GerritProject.startDate, 'yyyy-MM-dd');
			var endDateString = $filter('date')(GerritProject.endDate, 'yyyy-MM-dd');
			this.numberOfChanges = this.openChangesCount + this.mergedChangesCount + this.abandonedChangesCount;
			this.submitters = angular.element.unique(this.submitters);
			
			$log.info("Total number of changes: " + this.totalNumberOfChanges);
			$log.info("Printing report for: " + this.projectName);
			$log.info("Number of changes between " + startDateString + " and " + endDateString + ": " + this.numberOfChanges);
			$log.info("Number of open changes between " + startDateString + " and " + endDateString + ": " + this.openChangesCount);
			$log.info("Number of merged changes between " + startDateString+" and " + endDateString + ": " + this.mergedChangesCount);
			$log.info("Number of abandoned changes between " + startDateString+" and " + endDateString + ": " + this.abandonedChangesCount);
 			$log.info("Number of self submit changes between " + startDateString+" and " + endDateString + ": " + this.noReviewChanges);			
			$log.info("Number of collaborative changes between " + startDateString+" and " + endDateString + ": " + this.collaborativeDevChanges);
			$log.info("Number of single peer review changes between " + startDateString+" and " + endDateString + ": " + this.singlePeerChanges);
			$log.info("Number of 2+ peer review changes between " + startDateString+" and " + endDateString + ": " + this.twoPlusPeerChanges);		
			$log.info("Number of submitters between " + startDateString + " and " + endDateString + ": " + this.submitters.length); 
			
			angular.forEach(this.submitters, function(submitter) {
				$log.info(submitter);
			});	

			Morris.Donut({
			  element: this.projectName,
			  data: [
				{label: "Self Submit", value: this.noReviewChanges},
				{label: "Collaborative", value: this.collaborativeDevChanges},
				{label: "Single Peer Reviews", value: this.singlePeerChanges},
				{label: "2+ Peer Reviews", value: this.twoPlusPeerChanges}
			  ],
			  resize: true,
			  colors: appConfig.gerrit.colors
			});
		}
		
		function analyseChange(change) {
			var ownerName = "";
			if (change.owner) {
				ownerName = change.owner.name;
				this.submitters.push(ownerName);
			} 
			
			var authors = [];
			var revisions = change.revisions;
			
			angular.forEach(revisions, function(revision) {
				authors.push(revision.commit.author.name);
			});
			
			authors = angular.element.unique(authors);
			if(authors.length <= 1){
				//Work out number of Reviewers
                var labels = change.labels;
                var codeReview;
                var array = [];
				
                if(labels != null && labels["Code-Review"] != null){
                    codeReview = labels["Code-Review"];
                    if(codeReview != null && codeReview.all != null){
                        array = codeReview.all;
                    }
                }
				
                var arraySize = 0;               
				angular.forEach(array, function(reviewer) {
					var reviewerName = reviewer.name;
					var reviewerValue = reviewer.value;
					var compareValue = 0;
					
					if(reviewerValue > compareValue && !(reviewerName == ownerName || GerritProject.botName == reviewerName)){
                        arraySize = arraySize + 1;
                    }
				});
				
                if(arraySize > 1){
                    this.twoPlusPeerChanges = this.twoPlusPeerChanges + 1;
                }else if (arraySize == 1){
                    this.singlePeerChanges = this.singlePeerChanges + 1;
                }else{
                	$log.info("NO REVIEW CHANGE FOUND: " + change.change_id);
                    this.noReviewChanges = this.noReviewChanges + 1
                }
			} else {
				this.collaborativeDevChanges = this.collaborativeDevChanges + 1;
			}
		}
		
		function processChange(change) {
			var gerritProject = this;
			return GerritProject.getChange(change.change_id).then(function(response) {
				gerritProject.analyseChange(response.data);	
				//$log.debug("Analysed: " + response.data.id);
			});
		}
		
		function analyseChanges(changes, merged) {
			var count = 0;						
			var gerritProject = this;
			
			angular.forEach(changes, function(change) {                                           
                var created = Date.parse(change.created);
                var updated = Date.parse(change.updated);
                var project = change.project;
                if(gerritProject.projects.indexOf(project) > -1 && updated > GerritProject.startDate.getTime() && updated < GerritProject.endDate.getTime()){
                    count = count + 1;
                    if(merged) {
						gerritProject.promises.push(gerritProject.processChange(change));
                    }
                }
            });			
			
			return count;
		}

		function analyseProjects() {
			var gerritProject = this;
			GerritProject.getChanges('open').then(function(response) {		
				gerritProject.openChanges = response.data;
				gerritProject.openChangesCount = response.data.length;
				
				GerritProject.getChanges('merged').then(function(response) {		
					gerritProject.mergedChanges = response.data;
					gerritProject.mergedChangesCount = response.data.length;
						
					GerritProject.getChanges('abandoned').then(function(response) {
						gerritProject.abandonedChanges = response.data;						
						gerritProject.abandonedChangesCount = response.data.length;
						gerritProject.totalNumberOfChanges = gerritProject.openChangesCount + gerritProject.mergedChangesCount + gerritProject.abandonedChangesCount;
						
						// Include all open changes in count by not filtering them
						gerritProject.openChangesCount = gerritProject.analyseChanges(gerritProject.openChanges, false);												
						gerritProject.abandonedChangesCount = gerritProject.analyseChanges(gerritProject.abandonedChanges, false);
						gerritProject.mergedChangesCount = gerritProject.analyseChanges(gerritProject.mergedChanges, true);
						
						$q.all(gerritProject.promises).then(function() { 
							gerritProject.generateReport(); 
						});
					});			
				});
			});			
		}
		
		return (GerritProject);
	}
]);