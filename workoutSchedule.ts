import {gql, UserInputError} from "apollo-server-express";
import {v4 as uuidv4} from "uuid";

export interface Workout {
    id: number;
    name: string;
}

export enum TimeOfDay {
    FIRST_THING = "FIRST_THING",
    MORNING = "MORNING",
    AFTERNOON = "AFTERNOON",
    EVENING = "EVENING"
}

export interface WorkoutSchedule {
    id: string;
    userId: string;
    workoutId: number;
    scheduledDay: Date;
    scheduledTime: TimeOfDay;
}

export const typeDefs = gql`
    type Workout {
        id: Int!
        name: String!
    }

    type WorkoutSchedule {
        id: String!
        userId: String!
        workoutId: Int!
        workout: Workout!
        scheduledDay: String!
        scheduledTime: TimeOfDay!
    }

    enum TimeOfDay {
        FIRST_THING
        MORNING
        AFTERNOON
        EVENING
    }

    type Query {
        getWorkoutSchedules(start: String!, end: String!): [WorkoutSchedule!]!
        getWorkoutSchedule(id: String!): WorkoutSchedule
    }
    
    type Mutation {
        createWorkoutSchedule(workoutId: Int!, scheduledDay: String!, scheduledTime: TimeOfDay!): WorkoutSchedule!
        updateWorkoutSchedule(id: String!, workoutId: Int, scheduledTime: TimeOfDay): WorkoutSchedule
        deleteWorkoutSchedule(id: String!): Boolean
    }
`;


// Sample data - would be stored in db
let workouts: Workout[] = [
    {id: 1, name: "workout 1"},
    {id: 2, name: "workout 2"},
];
// tmp storage refreshes after each run for now - would be stored in db
export let workoutSchedules: WorkoutSchedule[] = [
    {
    id: "2c7f5f3b-02ff-4983-b7a5-cf27f9dd65b4",
    userId: "acde070d-8c4c-4f0d-9d8a-162843c10333",
    workoutId: 1,
    scheduledTime: TimeOfDay.AFTERNOON,
    scheduledDay: new Date('2024-01-01')
  }
];


// dummy authenticated user
const getUserId = (): string => {
    return "acde070d-8c4c-4f0d-9d8a-162843c10333"
}


const fetchWorkoutSchedule = (id: string, userId: string): WorkoutSchedule | null => {
    return workoutSchedules.find(workoutSchedule => workoutSchedule.id === id && workoutSchedule.userId === userId) || null;
}

const fetchWorkoutSchedules = (userId: string, start: Date, end: Date): WorkoutSchedule[] => {
    return workoutSchedules.filter(
        workoutSchedule => workoutSchedule.userId === userId &&
            workoutSchedule.scheduledDay >= start && workoutSchedule.scheduledDay <= end
    );
}

const fetchWorkout = (id: number): Workout | null => {
    return workouts.find(workout => workout.id === id) || null;
}

export const resolvers = {
    Query: {
        getWorkoutSchedules: (_: any, args: { start: string, end: string }) => {
            // TODO: should probably create a custom graphql type for proper parsing.
            return fetchWorkoutSchedules(getUserId(), new Date(args.start),  new Date(args.end))
        },
        getWorkoutSchedule: (_: any, args: { id: string }) => fetchWorkoutSchedule(args.id, getUserId()),
    },
    Mutation: {
        // TODO: add ability to create multiple schedules at once, depends on the UX flow we want in the front end - not provided
        // Is the user selecting a workout first and then days to schedule it for OR select day then workout? - not stated in doc
        createWorkoutSchedule: (_: any, {
            workoutId,
            scheduledDay,
            scheduledTime
        }: { workoutId: number, scheduledDay: string, scheduledTime: TimeOfDay }): WorkoutSchedule => {
            if (fetchWorkout(workoutId) === null) {
                throw new UserInputError('Workout does not exist');
            }
            const scheduledDayDate = new Date(scheduledDay); // TODO: should probably create a custom graphql type for proper parsing.
            if (fetchWorkoutSchedules(getUserId(), scheduledDayDate, scheduledDayDate).length > 0) {
                // requirement - only one workout per day.
                throw new UserInputError('Workout schedule already exists for this day');
            }
            const newSchedule: WorkoutSchedule = {
                id: uuidv4(), // let db handle conflicts
                userId: getUserId(),
                workoutId,
                scheduledDay: scheduledDayDate,
                scheduledTime,
            };
            workoutSchedules.push(newSchedule);
            return newSchedule;
        },
        updateWorkoutSchedule: (_: any, {
            id,
            workoutId,
            scheduledTime
        }: { id: string, workoutId?: number, scheduledTime?: TimeOfDay }): WorkoutSchedule => {
            const workoutSchedule = fetchWorkoutSchedule(id, getUserId());
            if (workoutSchedule === null) {
                throw new UserInputError('Workout Schedule does not exist');
            }
            // this will make updates to original object, in db this would be two steps fetch and then commit
            if (workoutId) workoutSchedule.workoutId = workoutId;
            if (scheduledTime) workoutSchedule.scheduledTime = scheduledTime;
            return workoutSchedule;
        },
        deleteWorkoutSchedule: (_: any, {id}: { id: string }): boolean => {
            const index = workoutSchedules.findIndex(workoutSchedule => workoutSchedule.id === id && workoutSchedule.userId == getUserId());
            if (index !== -1) {
                workoutSchedules.splice(index, 1);
                return true;
            }
            return false;
        },
    },
    WorkoutSchedule: {
        workout: (parent: WorkoutSchedule): Workout => {
            const workout = fetchWorkout(parent.workoutId);
            if (workout === null) {
            throw new UserInputError('Workout does not exist');
        }
          return workout;
        }
    },
};
