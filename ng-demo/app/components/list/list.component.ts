import {Component, NgZone} from "@angular/core";
import {Router} from "@angular/router";
import {Location} from "@angular/common";
import {CouchbaseInstance} from "../../couchbaseinstance";

@Component({
    selector: "my-app",
    templateUrl: "./components/list/list.component.html",
})
export class ListComponent {

    private database: any;
    private router: Router;
    private ngZone: NgZone;
    public personList: Array<Object>;

    constructor(router: Router, location: Location, ngZone: NgZone, couchbaseInstance: CouchbaseInstance) {
        this.router = router;
        this.ngZone = ngZone;
        this.database = couchbaseInstance.getDatabase();
        this.personList = [];

        couchbaseInstance.startSync(true);

        this.database.addDatabaseChangeListener((changes) => {
            let changeIndex;
            for (var i = 0; i < changes.length; i++) {
                let documentId = changes[i].getDocumentId();
                changeIndex = this.indexOfObjectId(documentId, this.personList);
                let document = this.database.getDocument(documentId);
                this.ngZone.run(() => {
                    if (changeIndex == -1) {
                        this.personList.push(document);
                    } else {
                        this.personList[changeIndex] = document;
                    }
                });
            }
        });

        location.subscribe((path) => {
            this.refresh();
        });

        this.refresh();
    }

    create() {
        this.router.navigate(["create"]);
    }

    private refresh() {
        this.personList = [];
        let rows = this.database.executeQuery("people");
        for(let i = 0; i < rows.length; i++) {
            this.personList.push(rows[i]);
            console.log("before adding fields " + i + " to document");
            rows[i]["test_" + i] = i;
            
            rows[i].data = {"pulse":72,"mean":0,"diap":80,"sysp":120,"arm":1,"dateTime":"2016-12-22T00:46:10.411Z","assessmentBMI":{"text_long":"According to the CDC, your body mass index of 25.8 is considered overweight. Being overweight may cause high blood pressure or hypertension","text_short":"Overweight","title":"","icon":1},"assessmentBP":{"text_long":"Systolic & Diastolic Prehypertension: If under hypertension therapy, you reached your blood pressure goal, keep up the good work! It's recommended you make lifestyle changes including diet and exercise to improve your blood pressure. ","text_short":"Systolic & Diastolic Prehypertension: If under hypertension therapy, you reached your blood pressure goal, keep up the good work! It's recommended you make lifestyle changes including diet and exercise to improve your blood pressure. ","title":"","icon":0},"assessmentHR":{"text_long":"A heart rate of 72 is normal. ","text_short":"A heart rate of 72 is normal. ","title":"","icon":0},"comments":""};
            
            this.database.updateDocument(rows[i]._id, rows[i]);
            console.log("after adding fields " + i + " to document");
        }
    }

    private indexOfObjectId(needle: string, haystack: any) {
        for (let i = 0; i < haystack.length; i++) {
            if (haystack[i] != undefined && haystack[i].hasOwnProperty("_id")) {
                if (haystack[i]._id == needle) {
                    return i;
                }
            }
        }
        return -1;
    }

}
