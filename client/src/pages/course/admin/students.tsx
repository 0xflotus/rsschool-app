import * as React from 'react';
import _ from 'lodash';
import { Table, Typography, Statistic, Divider } from 'antd';
import { Header, withSession, LoadingScreen, GithubAvatar } from 'components';
import withCourseData from 'components/withCourseData';
import { getColumnSearchProps, stringSorter, numberSorter } from 'components/Table';
import { CourseService, StudentDetails } from 'services/course';
import { CoursePageProps } from 'services/models';
import css from 'styled-jsx/css';

const { Text } = Typography;

type State = {
  students: StudentDetails[];
  isLoading: boolean;
  stats: {
    studentCount: number;
    activeStudentCount: number;
    countries: { name: string; count: number; totalCount: number }[];
  };
};

class ScorePage extends React.Component<CoursePageProps, State> {
  state: State = {
    isLoading: false,
    students: [],
    stats: {
      studentCount: 0,
      activeStudentCount: 0,
      countries: [],
    },
  };

  private courseService = new CourseService();

  async componentDidMount() {
    this.setState({ isLoading: true });

    const courseId = this.props.course.id;
    const courseStudents = await this.courseService.getCourseStudents(courseId);
    let activeStudentCount = 0;
    const countries: Record<string, { count: number; totalCount: number }> = {};

    for (const courseStudent of courseStudents) {
      const { countryName } = courseStudent;
      if (!countries[countryName]) {
        countries[countryName] = { count: 0, totalCount: 0 };
      }
      countries[countryName].totalCount++;
      if (courseStudent.isActive) {
        activeStudentCount++;
        countries[countryName].count++;
      }
    }

    this.setState({
      students: courseStudents,
      isLoading: false,
      stats: {
        activeStudentCount,
        studentCount: courseStudents.length,
        countries: _.keys(countries).map(k => ({
          name: k,
          count: countries[k].count,
          totalCount: countries[k].totalCount,
        })),
      },
    });
  }

  render() {
    return (
      <>
        <Header title="Course Students" username={this.props.session.githubId} courseName={this.props.course.name} />
        <LoadingScreen show={this.state.isLoading}>
          <Statistic
            className="m-3"
            title="Active Students"
            value={this.state.stats.activeStudentCount}
            suffix={`/ ${this.state.stats.studentCount}`}
          />
          <Table
            className="m-3"
            pagination={false}
            size="small"
            rowKey="name"
            dataSource={this.state.stats.countries}
            columns={[
              { title: 'Country', dataIndex: 'name' },
              { title: 'Active Students', dataIndex: 'count' },
              { title: 'Total Students', dataIndex: 'totalCount' },
            ]}
          />
          <Divider dashed />
          <Table<StudentDetails>
            bordered
            className="m-3"
            pagination={{ pageSize: 100 }}
            size="small"
            rowKey="githubId"
            rowClassName={record => (!record.isActive ? 'rs-table-row-disabled' : '')}
            dataSource={this.state.students}
            columns={[
              {
                title: 'Github',
                dataIndex: 'githubId',
                sorter: stringSorter('githubId'),
                width: 120,
                key: 'githubId',
                render: (value: string) => (
                  <div className="d-flex flex-row">
                    <GithubAvatar githubId={value} size={24} />
                    &nbsp;<a href={`/profile?githubId=${value}`}>{value}</a>
                  </div>
                ),
                ...getColumnSearchProps('githubId'),
              },
              {
                title: 'Name',
                dataIndex: 'lastName',
                key: 'lastName',
                width: 150,
                sorter: stringSorter('firstName'),
                render: (_: any, record: StudentDetails) => `${record.firstName} ${record.lastName}`,
                ...getColumnSearchProps('lastName'),
              },
              {
                title: 'Mentor',
                dataIndex: 'mentor.githubId',
                key: 'mentor.githubId',
                width: 100,
                render: (value: string) => <a href={`/profile?githubId=${value}`}>{value}</a>,
                ...getColumnSearchProps('mentor.githubId'),
              },
              {
                title: 'Location',
                dataIndex: 'locationName',
                key: 'locationName',
                width: 100,
                sorter: stringSorter('locationName'),
                ...getColumnSearchProps('locationName'),
              },
              {
                title: 'Country',
                dataIndex: 'countryName',
                key: 'countryName',
                width: 100,
                sorter: stringSorter('countryName'),
                ...getColumnSearchProps('countryName'),
              },
              {
                title: 'Total',
                dataIndex: 'totalScore',
                key: 'totalScore',
                width: 100,
                sorter: numberSorter('totalScore'),
                render: value => <Text strong>{value}</Text>,
              },
            ]}
          />
        </LoadingScreen>
        <style jsx>{styles}</style>
      </>
    );
  }
}

const styles = css`
  :global(.rs-table-row-disabled) {
    opacity: 0.25;
  }
`;

export default withCourseData(withSession(ScorePage));
